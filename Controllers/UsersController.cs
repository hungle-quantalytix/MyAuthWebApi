using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyAuthWebApi.Data;
using MyAuthWebApi.Models;

namespace MyAuthWebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<QtxUser> _userManager;
        private readonly ApplicationDbContext _context;
        public UsersController(UserManager<QtxUser> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponse>>> GetUsers()
        {
            var users = await _userManager.Users.Select(user => new UserResponse
            {
                Id = user.Id,
                Email = user.Email,
                Roles = _userManager.GetRolesAsync(user).Result,
                Claims = user.Claims.Select(c => c.DisplayName).ToList()
            }).ToListAsync();
            
            return users;
        }

        [HttpPost("assign-role")]
        public async Task<ActionResult<QtxUser>> AssignRoleByName(AssignRoleByNameRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return NotFound();
            }
            await _userManager.AddToRoleAsync(user, request.Role);
            return user;
        }
        
        [HttpPost("assign-claim")]
        public async Task<ActionResult<QtxUser>> AssignClaimByName(AssignClaimByNameRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            var claim = await _context.Claims.FirstOrDefaultAsync(c => c.Id == request.ClaimId);
            if (claim == null)
            {
                return BadRequest("Claim not found");
            }

            user.Claims.Add(claim);
            await _context.SaveChangesAsync();
            
            return user;
        }   
    }

    public record AssignClaimByNameRequest(string Email, int ClaimId);
    public record AssignRoleByNameRequest(string Email, string Role);
    public class UserResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public IEnumerable<string> Roles { get; set; } = new List<string>();
        public IEnumerable<string> Claims { get; set; } = new List<string>();
        // public IEnumerable<string> Permissions { get; set; } = new List<string>();
    }
}
