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
                AllowedGrantTypes = GrantTypes.ClientCredentials,
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

    public static IEnumerable<ExternalProvider> GetExternalProviders() =>
        new List<ExternalProvider>
        {
            new ExternalProvider
            {
                DisplayName = "Okta",
                AuthenticationScheme = "okta", // Name for the scheme
                Authority = "https://dev-64890073.okta.com", // Okta domain
                ClientId = "0oakfcc507HIMlLpw5d7",
                ClientSecret = "9SLd0wFQ7AWqN_e4URqVRvL6H7Zm4K3MRLaQqgkSoenfaJGZIrfi8nd0HZ_S9Ahg",
                CallbackPath = "/auth/callback" // Relative path for your IdentityServer to receive the callback
            }
        };
}
