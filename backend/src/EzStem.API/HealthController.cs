using EzStem.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.API;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromServices] EzStemDbContext dbContext)
    {
        try
        {
            await dbContext.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "unhealthy",
                database = "unreachable",
                detail = ex.Message,
                timestamp = DateTime.UtcNow.ToString("o")
            });
        }

        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow.ToString("o")
        });
    }
}
