using Microsoft.AspNetCore.Mvc;
using RoiExtractor.Api.Models;
using RoiExtractor.Api.Parsers;
using RoiExtractor.Api.Services;

namespace RoiExtractor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExtractController(IAnthropicService anthropic, ILogger<ExtractController> logger)
    : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<RoarData>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<RoarData>> Extract(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".pdf" or ".pptx"))
            return BadRequest(new { error = "Only PDF and PPTX files are supported." });

        logger.LogInformation("Processing {FileName} ({Bytes:N0} bytes)", file.FileName, file.Length);

        try
        {
            RoarData result;

            if (ext == ".pdf")
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms, ct);
                result = await anthropic.ExtractFromPdfAsync(Convert.ToBase64String(ms.ToArray()), ct);
            }
            else
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms, ct);
                ms.Position = 0;
                var text = PptxParser.ExtractText(ms);
                result = await anthropic.ExtractFromTextAsync(text, ct);
            }

            return Ok(result);
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "Claude API error");
            return StatusCode(StatusCodes.Status502BadGateway, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Extraction failed");
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = ex.Message });
        }
    }
}
