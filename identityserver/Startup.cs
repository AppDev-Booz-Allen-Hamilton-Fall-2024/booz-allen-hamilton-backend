using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.Cookies;
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

<<<<<<< HEAD
        // Add external authentication (Okta)
        services.AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = "okta";
    })
            .AddOpenIdConnect("okta", "Okta", options =>
            {
                options.Authority = Environment.GetEnvironmentVariable("AUTHORITY") ?? "https://dev-64890073.okta.com";
                options.ClientId = Environment.GetEnvironmentVariable("CLIENT_ID") ?? "0oakfcc507HIMlLpw5d7";
                options.ClientSecret = Environment.GetEnvironmentVariable("CLIENT_SECRET") ?? "9SLd0wFQ7AWqN_e4URqVRvL6H7Zm4K3MRLaQqgkSoenfaJGZIrfi8nd0HZ_S9Ahg";
                options.CallbackPath = Environment.GetEnvironmentVariable("CALLBACK_PATH") ?? "http://localhost:4000/auth/callback";
=======
        // Add external authentication (Okta) CHANGE ALL VARS TO ENV
        services.AddAuthentication()
            .AddOpenIdConnect("okta", "Okta", options =>
            {
                options.Authority = "https://dev-64890073.okta.com";
                options.ClientId = "0oakfcc507HIMlLpw5d7";
                options.ClientSecret = "9SLd0wFQ7AWqN_e4URqVRvL6H7Zm4K3MRLaQqgkSoenfaJGZIrfi8nd0HZ_S9Ahg";
                options.CallbackPath = "https://localhost:4000/auth/callback";
>>>>>>> 24bf30f4d2e45b30b56f7e29ff13dd776fa696c2
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
            endpoints.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}");
        });
    }
}
