using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddControllersWithViews();

        // Configure Duende IdentityServer
        var builder = services.AddIdentityServer(options =>
        {
            options.Events.RaiseErrorEvents = true;
            options.Events.RaiseInformationEvents = true;
            options.Events.RaiseFailureEvents = true;
            options.Events.RaiseSuccessEvents = true;
        })
        .AddDeveloperSigningCredential()
        .AddInMemoryClients(IdentityServerConfig.Clients)
        .AddInMemoryApiScopes(IdentityServerConfig.ApiScopes)
        .AddInMemoryIdentityResources(IdentityServerConfig.IdentityResources);

        // Add external authentication (Okta)
        services.AddAuthentication()
            .AddOpenIdConnect("okta", "Okta", options =>
            {
                options.Authority = Environment.GetEnvironmentVariable("AUTHORITY") ?? "https://dev-64890073.okta.com/oauth2/default";
                options.ClientId = Environment.GetEnvironmentVariable("CLIENT_ID") ?? "0oakfcc507HIMlLpw5d7";
                options.ClientSecret = Environment.GetEnvironmentVariable("CLIENT_SECRET") ?? "9SLd0wFQ7AWqN_e4URqVRvL6H7Zm4K3MRLaQqgkSoenfaJGZIrfi8nd0HZ_S9Ahg";
                options.CallbackPath = Environment.GetEnvironmentVariable("CALLBACK_PATH") ?? "/auth/callback";
                options.ResponseType = "code";
                options.SaveTokens = true;
                options.Scope.Add("openid");
                options.Scope.Add("profile");
                options.Scope.Add("email");
            });
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        else
        {
            app.UseExceptionHandler("/Home/Error");
            app.UseHsts();
        }

        app.UseHttpsRedirection();
        app.UseStaticFiles();
        
        app.UseIdentityServer();
        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapDefaultControllerRoute();
        });
    }
}
