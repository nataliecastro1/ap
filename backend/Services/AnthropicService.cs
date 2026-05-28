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

// Handles Claude returning "1,080,000" or "$1,080,000" instead of 1080000
file sealed class FlexibleDecimalConverter : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader reader, Type _, JsonSerializerOptions __)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return reader.GetDecimal();

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

public class AnthropicService(HttpClient http, IConfiguration config) : IAnthropicService
{
    private const string ApiUrl = "https://api.anthropic.com/v1/messages";
    private const string Model  = "claude-sonnet-4-20250514";

    private readonly string _apiKey =
        config["Anthropic:ApiKey"] is { Length: > 0 } k
            ? k
            : throw new InvalidOperationException(
                "Anthropic:ApiKey is missing. Add it to appsettings.Development.json or set " +
                "the environment variable ANTHROPIC__ApiKey.");

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        Converters                  = { new FlexibleDecimalConverter() },
    };

    public Task<RoarData> ExtractFromPdfAsync(string base64Pdf, CancellationToken ct = default)
    {
        var content = new object[]
        {
            new { type = "document", source = new { type = "base64", media_type = "application/pdf", data = base64Pdf } },
            new { type = "text", text = ExtractionPrompt }
        };
        return CallClaudeAsync(content, ct);
    }

    public Task<RoarData> ExtractFromTextAsync(string text, CancellationToken ct = default)
    {
        var content = new object[]
        {
            new { type = "text", text = $"PPTX Document Content:\n\n{text}\n\n---\n\n{ExtractionPrompt}" }
        };
        return CallClaudeAsync(content, ct);
    }

    private async Task<RoarData> CallClaudeAsync(object[] content, CancellationToken ct)
    {
        var body = new
        {
            model      = Model,
            max_tokens = 4096,
            messages   = new[] { new { role = "user", content } }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, ApiUrl)
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("x-api-key", _apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");

        var response = await http.SendAsync(request, ct);
        var json     = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Claude API returned {(int)response.StatusCode}: {json}");

        using var doc  = JsonDocument.Parse(json);
        var rawText    = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
        return ParseResponse(rawText);
    }

    private static RoarData ParseResponse(string raw)
    {
        var s = raw.Trim();
        s = Regex.Replace(s, @"^```(?:json)?\s*", "").TrimEnd().TrimEnd('`').Trim();
        var i0 = s.IndexOf('{');
        var i1 = s.LastIndexOf('}');
        if (i0 >= 0 && i1 > i0) s = s[i0..(i1 + 1)];

        return JsonSerializer.Deserialize<RoarData>(s, JsonOpts)
            ?? throw new InvalidOperationException($"Failed to parse Claude response. Preview: {s[..Math.Min(300, s.Length)]}");
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
