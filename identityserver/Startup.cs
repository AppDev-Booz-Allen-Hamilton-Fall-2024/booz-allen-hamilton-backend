using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        Console.WriteLine("BOOZ ALLEN!");
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

        // Add external authentication (Okta) CHANGE ALL VARS TO ENV
        services.AddAuthentication()
            .AddOpenIdConnect("okta", "Okta", options =>
            {
                options.Authority = "https://dev-64890073.okta.com";
                options.ClientId = "0oakfcc507HIMlLpw5d7";
                options.ClientSecret = "9SLd0wFQ7AWqN_e4URqVRvL6H7Zm4K3MRLaQqgkSoenfaJGZIrfi8nd0HZ_S9Ahg";
                options.CallbackPath = "https://localhost:4000/auth/callback";
                options.ResponseType = "code";
                options.SaveTokens = true;
                options.Scope.Add("openid");
                options.Scope.Add("profile");
                options.Scope.Add("email");
            });
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        Console.WriteLine("BOOZ ALLEN!");
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        else
        {
            app.UseExceptionHandler("/Home/Error");
            app.UseHsts();
        }

        //app.UseHttpsRedirection();
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
