using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using MyAuthWebApi.Attributes;
using MyAuthWebApi.Data;

namespace MyAuthWebApi.Middlewares;

public class PermissionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<PermissionMiddleware> _logger;

    public PermissionMiddleware(RequestDelegate next, IHttpContextAccessor httpContextAccessor, ILogger<PermissionMiddleware> logger)
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
 
        var permissionAttribute = endpoint.Metadata.GetMetadata<RequirePermissionAttribute>();
        if (permissionAttribute != null)
        {
            var userId = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("Unauthorized");
                return;
            }
            
            //TODO for now just support User subject type
            var permission = await dbContext.Permissions
                                        .FirstOrDefaultAsync(p => (p.Action == permissionAttribute.Action || p.Action == "*")
                                        && (p.ResourceType == permissionAttribute.ResourceType || p.ResourceType == "*")
                                        && (p.ResourceId == permissionAttribute.ResourceId || p.ResourceId == "*")
                                        && (p.SubjectType == "User" || p.SubjectType == "*")
                                        && (p.SubjectId == userId || p.SubjectId == "*"));
            if (permission == null)
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