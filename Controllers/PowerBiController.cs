using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class PowerBiController : ControllerBase
{
    private readonly PowerBiService _service;

    public PowerBiController(PowerBiService service)
    {
        _service = service;
    }

    /// <summary>
    /// Endpoint para obter o token de acesso ao Power BI
    /// </summary>
    [HttpGet("token")]
    public async Task<IActionResult> GetToken()
    {
        try
        {
            var token = await _service.GetAccessTokenAsync();
            return Ok(new { AccessToken = token });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Failed to retrieve token.", Error = ex.Message });
        }
    }

    /// <summary>
    /// Endpoint para obter a lista de workspaces do Power BI
    /// </summary>
    [HttpGet("workspaces")]
    public async Task<IActionResult> GetWorkspaces()
    {
        try
        {
            var workspaces = await _service.GetWorkspacesAsync(); // Chama o serviço para buscar os workspaces
            return Content(workspaces, "application/json"); // Retorna o JSON como string
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Failed to fetch workspaces.", Error = ex.Message });
        }
    }
}
