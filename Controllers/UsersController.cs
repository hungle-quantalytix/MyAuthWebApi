using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyAuthWebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;

        public UsersController(UserManager<IdentityUser> userManager)
        {
            _userManager = userManager;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IdentityUser>>> GetUsers()
        {
            return await _userManager.Users.ToListAsync();
        }

        [HttpPost("assign-role")]
        public async Task<ActionResult<IdentityUser>> AssignRoleByName(AssignRoleByNameRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return NotFound();
            }
            await _userManager.AddToRoleAsync(user, request.Role);
            return user;
        }
        
    }

    public class AssignRoleByNameRequest
    {
        public required string Email { get; set; }
        public required string Role { get; set; }
    }
}
