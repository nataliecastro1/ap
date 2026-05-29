using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace RoiExtractor.Api.Parsers;

public static class PdfTextExtractor
{
    /// <summary>
    /// Extracts text from a PDF page by page.
    /// Works for any size file — sends text to the AI instead of the raw binary,
    /// which avoids Gemini free-tier size limits.
    /// </summary>
    public static string ExtractText(Stream stream)
    {
        using var pdf = PdfDocument.Open(stream);
        var sb = new StringBuilder();

        foreach (var page in pdf.GetPages())
        {
            var text = ContentOrderTextExtractor.GetText(page);
            if (string.IsNullOrWhiteSpace(text)) continue;

            sb.AppendLine($"--- Page {page.Number} ---");
            sb.AppendLine(text.Trim());
            sb.AppendLine();
        }

        return sb.ToString();
    }
}
