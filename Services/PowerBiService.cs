using Microsoft.Identity.Client;
using System.Net.Http.Headers;

public class PowerBiService
{
    private readonly string TenantId = "7a9e4f31-3a03-45c5-8f56-60c4e749c2ef";
    private readonly string ClientId = "c3da7a91-d044-4525-bdb4-2eb7c6af5aba";
    private readonly string ClientSecret = "tBm8Q~rFDsY1R2l6SlaJLoLOShRja4C3xFGqVbRt";
    private readonly string Scope = "https://analysis.windows.net/powerbi/api/.default";
    private readonly string Authority;

    public PowerBiService()
    {
        Authority = $"https://login.microsoftonline.com/{TenantId}";
    }

    /// <summary>
    /// Obtém o token de acesso para a API do Power BI.
    /// </summary>
    public async Task<string> GetAccessTokenAsync()
    {
        var app = ConfidentialClientApplicationBuilder.Create(ClientId)
            .WithClientSecret(ClientSecret)
            .WithAuthority(new Uri(Authority))
            .Build();

        var authResult = await app.AcquireTokenForClient(new[] { Scope }).ExecuteAsync();
        return authResult.AccessToken;
    }

    /// <summary>
    /// Busca os workspaces (grupos) disponíveis na conta do Power BI.
    /// </summary>
    public async Task<string> GetWorkspacesAsync()
    {
        string token = await GetAccessTokenAsync(); // Obtém o token de acesso
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("https://api.powerbi.com/v1.0/myorg/groups"); // Endpoint para workspaces
        response.EnsureSuccessStatusCode(); // Garante que a resposta foi bem-sucedida

        return await response.Content.ReadAsStringAsync(); // Retorna o JSON como string
    }
}