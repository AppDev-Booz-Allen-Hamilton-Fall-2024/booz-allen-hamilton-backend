using System.Collections.Generic;
using Duende.IdentityServer.Models;
using Duende.IdentityServer;

namespace System
{
    public static class IdentityServerConfig
    {
        public static IEnumerable<Client> Clients =>
            new List<Client>
            {
                new Client
                {
                    ClientId = "0oakfcc507HIMlLpw5d7",
                    AllowedGrantTypes = GrantTypes.Code, 
                    ClientSecrets = { new Secret("9SLd0wFQ7AWqN_e4URqVRvL6H7Zm4K3MRLaQqgkSoenfaJGZIrfi8nd0HZ_S9Ahg".Sha256()) },
                    RedirectUris = { "http://localhost:4000/auth/callback" }, 
                    AllowedScopes = { "openid", "profile", "email" },
                    RequirePkce = true,
                    RequireConsent = false 
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
                new IdentityResources.Profile(),
                new IdentityResources.Email()
            };
    }
}
