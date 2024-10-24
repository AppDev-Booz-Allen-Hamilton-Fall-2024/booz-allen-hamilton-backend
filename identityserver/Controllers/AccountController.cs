using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;

public class AccountController : Controller
{
    [HttpGet]
    public IActionResult Login()
    {
        var properties = new AuthenticationProperties 
        { 
            RedirectUri = "http://localhost:4000/auth/callback"
        };
        
        return Challenge(properties, "okta");
    }

    [HttpGet]
    public IActionResult Callback()
    {
        return LocalRedirect("http://localhost:4000/auth/callback"); 
    }

    [HttpPost]
    public IActionResult Logout()
    {
        return SignOut(new AuthenticationProperties { RedirectUri = "http://localhost:4000" }, CookieAuthenticationDefaults.AuthenticationScheme, "okta");
    }
}
