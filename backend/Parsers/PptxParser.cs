using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace RoiExtractor.Api.Parsers;

public static partial class PptxParser
{
    private static readonly XNamespace DrawingML =
        "http://schemas.openxmlformats.org/drawingml/2006/main";

    [GeneratedRegex(@"^ppt/slides/slide(\d+)\.xml$")]
    private static partial Regex SlidePattern();

    public static string ExtractText(Stream stream)
    {
        var slides = new List<(int Index, string Text)>();

        using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
        foreach (var entry in archive.Entries)
        {
            var m = SlidePattern().Match(entry.FullName);
            if (!m.Success) continue;

            var index = int.Parse(m.Groups[1].Value);
            using var entryStream = entry.Open();
            using var reader      = new StreamReader(entryStream, Encoding.UTF8);
            var xml  = reader.ReadToEnd();
            var text = SlideToText(xml);
            if (!string.IsNullOrWhiteSpace(text))
                slides.Add((index, text));
        }

        return string.Join(
            "\n\n",
            slides.OrderBy(s => s.Index).Select(s => $"--- Slide {s.Index} ---\n{s.Text}"));
    }

    private static string SlideToText(string xml)
    {
        try
        {
            var doc  = XDocument.Parse(xml);
            var lines = doc
                .Descendants(DrawingML + "p")
                .Select(p => string.Concat(p.Descendants(DrawingML + "t").Select(t => t.Value)))
                .Where(s => !string.IsNullOrWhiteSpace(s));
            return string.Join("\n", lines);
        }
        catch
        {
            // Fallback: raw regex if XML parse fails (e.g. embedded charts)
            var matches = Regex.Matches(xml, @"<a:t[^>]*>([^<]*)<\/a:t>");
            return string.Join(" ", matches.Select(m => m.Groups[1].Value));
        }
    }
}
