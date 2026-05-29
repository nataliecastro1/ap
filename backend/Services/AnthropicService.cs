using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using RoiExtractor.Api.Models;

namespace RoiExtractor.Api.Services;

public interface IAnthropicService
{
    Task<RoarData> ExtractFromPdfAsync(string base64Pdf, CancellationToken ct = default);
    Task<RoarData> ExtractFromTextAsync(string text, CancellationToken ct = default);
}

// Handles AI returning "1,080,000" or "$1,080,000" instead of a plain number
file sealed class FlexibleDecimalConverter : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader reader, Type _, JsonSerializerOptions __)
    {
        if (reader.TokenType == JsonTokenType.Number) return reader.GetDecimal();
        if (reader.TokenType == JsonTokenType.String)
        {
            var s = reader.GetString()?.Replace("$", "").Replace(",", "").Trim();
            return decimal.TryParse(s, out var d) ? d : 0;
        }
        reader.Skip();
        return 0;
    }
    public override void Write(Utf8JsonWriter writer, decimal value, JsonSerializerOptions _)
        => writer.WriteNumberValue(value);
}

/// <summary>
/// Supports both Google Gemini (key starts with "AIza") and Anthropic Claude (key starts with "sk-ant-").
/// To switch providers, just change Ai:ApiKey in appsettings — no code changes needed.
/// </summary>
public class AiExtractionService(HttpClient http, IConfiguration config) : IAnthropicService
{
    private readonly string _apiKey =
        config["Ai:ApiKey"] is { Length: > 0 } k ? k
        : throw new InvalidOperationException(
            "Ai:ApiKey is missing. Add it to appsettings.Development.json.\n" +
            "  Gemini (free):  AIzaSy… or AQ.…  →  get at aistudio.google.com\n" +
            "  Claude:         sk-ant-… →  get at console.anthropic.com");

    private bool IsGemini => _apiKey.StartsWith("AIza") || _apiKey.StartsWith("AQ.");

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        Converters                  = { new FlexibleDecimalConverter() },
    };

    // ── Public interface ──────────────────────────────────────────────────

    public Task<RoarData> ExtractFromPdfAsync(string base64Pdf, CancellationToken ct = default) =>
        IsGemini
            ? CallGeminiAsync(GeminiPdfParts(base64Pdf), ct)
            : CallClaudeAsync(ClaudePdfContent(base64Pdf), ct);

    public Task<RoarData> ExtractFromTextAsync(string text, CancellationToken ct = default) =>
        IsGemini
            ? CallGeminiAsync(GeminiTextParts(text), ct)
            : CallClaudeAsync(ClaudeTextContent(text), ct);

    // ── Gemini ────────────────────────────────────────────────────────────

    private static object[] GeminiPdfParts(string base64Pdf) =>
    [
        new { inline_data = new { mime_type = "application/pdf", data = base64Pdf } },
        new { text = ExtractionPrompt }
    ];

    private static object[] GeminiTextParts(string text) =>
    [
        new { text = $"PPTX Document Content:\n\n{text}\n\n---\n\n{ExtractionPrompt}" }
    ];

    private async Task<RoarData> CallGeminiAsync(object[] parts, CancellationToken ct)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";

        var body = new
        {
            contents = new[] { new { parts } },
            generationConfig = new { temperature = 0.1, maxOutputTokens = 4096 }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };

        var response = await http.SendAsync(request, ct);
        var json     = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            var hint = (int)response.StatusCode switch
            {
                503 => " — Gemini overloaded or PDF too large. Try a smaller file or wait 30 seconds and retry.",
                429 => " — Rate limit hit on the free tier. Wait 60 seconds and try again.",
                400 => " — Bad request. The file may be corrupted or unsupported.",
                401 or 403 => " — Invalid API key. Check your key in appsettings.Development.json.",
                _   => ""
            };
            throw new HttpRequestException($"Gemini API returned {(int)response.StatusCode}{hint}\n\nDetails: {json}");
        }

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.TryGetProperty("promptFeedback", out var feedback) &&
            feedback.TryGetProperty("blockReason", out var reason))
            throw new InvalidOperationException($"Gemini blocked the request: {reason.GetString()}");

        var rawText = root
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "";

        return ParseResponse(rawText);
    }

    // ── Claude ────────────────────────────────────────────────────────────

    private static object[] ClaudePdfContent(string base64Pdf) =>
    [
        new { type = "document", source = new { type = "base64", media_type = "application/pdf", data = base64Pdf } },
        new { type = "text", text = ExtractionPrompt }
    ];

    private static object[] ClaudeTextContent(string text) =>
    [
        new { type = "text", text = $"PPTX Document Content:\n\n{text}\n\n---\n\n{ExtractionPrompt}" }
    ];

    private async Task<RoarData> CallClaudeAsync(object[] content, CancellationToken ct)
    {
        var body = new
        {
            model      = "claude-sonnet-4-20250514",
            max_tokens = 4096,
            messages   = new[] { new { role = "user", content } }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("x-api-key", _apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");

        var response = await http.SendAsync(request, ct);
        var json     = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Claude API returned {(int)response.StatusCode}: {json}");

        using var doc = JsonDocument.Parse(json);
        var rawText   = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
        return ParseResponse(rawText);
    }

    // ── Shared ────────────────────────────────────────────────────────────

    private static RoarData ParseResponse(string raw)
    {
        var s = raw.Trim();
        s = Regex.Replace(s, @"^```(?:json)?\s*", "").TrimEnd().TrimEnd('`').Trim();
        var i0 = s.IndexOf('{');
        var i1 = s.LastIndexOf('}');
        if (i0 >= 0 && i1 > i0) s = s[i0..(i1 + 1)];

        return JsonSerializer.Deserialize<RoarData>(s, JsonOpts)
            ?? throw new InvalidOperationException(
                $"Failed to parse AI response as JSON. Preview: {s[..Math.Min(300, s.Length)]}");
    }

    private const string ExtractionPrompt = """
        You are analyzing an Anglepoint ROAR (Risk & Opportunity Assessment Report) —
        an IT Asset Management consulting deliverable.
        Extract all ROI metrics and return them as a single JSON object.

        Return ONLY valid JSON, no markdown fences, no other text:
        {
          "client": "client company name",
          "publisher": "software publisher (e.g. IBM, Microsoft, Oracle)",
          "date_delivered": "date as written in the document",
          "year": "4-digit year",
          "currency": "USD",
          "identified_risk": 0,
          "identified_cost_avoidance": 0,
          "accomplished_cost_avoidance": 0,
          "identified_cost_optimization": 0,
          "accomplished_cost_optimization": 0,
          "realized_cost_savings": 0,
          "annual_publisher_contract_spend": 0,
          "pricing_available": "Yes",
          "notes": "",
          "elevate_deliverable": "Yes",
          "breakdown": [
            {
              "product": "product or topic name",
              "category": "Risk|Cost Avoidance|Cost Optimization|Savings",
              "identified": 0,
              "accomplished": 0,
              "description": "one-line description"
            }
          ]
        }

        Rules:
        - All monetary values: plain numbers only, no $ or commas, use 0 if not found
        - Empty string for missing text fields
        - identified_risk: total compliance/audit risk exposure if unaddressed
        - identified_cost_avoidance: licensing costs that COULD be avoided
        - accomplished_cost_avoidance: avoidance costs already ACHIEVED
        - identified_cost_optimization: licensing optimization opportunities identified
        - accomplished_cost_optimization: optimizations already implemented
        - realized_cost_savings: total confirmed savings (sub-capacity, ILMT, BYOL, etc.)
        - annual_publisher_contract_spend: client's annual spend with that publisher
        - Populate breakdown with EVERY distinct financial line item found
        - pricing_available: Yes / No / Partial
        - elevate_deliverable: Yes / No
        - Return ONLY the JSON object, nothing else
        """;
}
