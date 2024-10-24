using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;

public class AccountController : Controller
{
    [HttpGet]
    public IActionResult Login(string returnUrl)
    {
    var properties = new AuthenticationProperties { RedirectUri = returnUrl ?? "http://localhost:3000/upload-policies" };
        return Challenge(properties, "okta");
    }

    [HttpGet]
    public IActionResult Callback(string returnUrl)
    {
        return LocalRedirect(returnUrl);
    }

    [HttpPost]
    public IActionResult Logout()
    {
        return SignOut(new AuthenticationProperties { RedirectUri = "/" }, CookieAuthenticationDefaults.AuthenticationScheme, "okta");
    }
}
