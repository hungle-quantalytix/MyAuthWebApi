using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using MyAuthWebApi.Attributes;
using MyAuthWebApi.Data;

namespace MyAuthWebApi.Middlewares;

public class ClaimMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<ClaimMiddleware> _logger;

    public ClaimMiddleware(RequestDelegate next, IHttpContextAccessor httpContextAccessor, ILogger<ClaimMiddleware> logger)
    {
        _next = next;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint == null)
        {
            await _next(context);
            return;
        }

        var claimAttribute = endpoint.Metadata.GetMetadata<RequireClaimAttribute>();
        if (claimAttribute != null)
        {
            var userId = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("Unauthorized");
                return;
            }

            var matchedClaim = await dbContext
            .Users.Where(x => x.Id == userId)
            .SelectMany(x => x.Claims)
            .Where(x => (x.Action == claimAttribute.Action || x.Action == "*")
                    && (x.ResourceType == claimAttribute.ResourceType || x.ResourceType == "*")).FirstOrDefaultAsync();
            if (matchedClaim == null)
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("Permission denied");
                return;
            }
        }

        await _next(context);
    }
}