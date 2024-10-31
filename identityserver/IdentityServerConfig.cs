using System.Collections.Generic;
using Duende.IdentityServer.Models;
using Duende.IdentityServer;

public static class IdentityServerConfig
{
    public static IEnumerable<Client> Clients =>
        new List<Client>
        {
            new Client
            {
                ClientId = "express_app_12345",
                AllowedGrantTypes = GrantTypes.Code,
                RedirectUris = {"http://localhost:4000/auth/callback"},
                AllowedScopes = { "openid", "profile", "email" },
                RequireClientSecret = false
            }
        };

    public static IEnumerable<ApiScope> ApiScopes =>
        new List<ApiScope>
        {
            new ApiScope("api1", "My API")
        };

    public static IEnumerable<IdentityResource> IdentityResources =>
        new List<IdentityResource>
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile()
        };

}
