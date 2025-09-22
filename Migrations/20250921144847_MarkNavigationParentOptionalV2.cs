using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyAuthWebApi.Migrations
{
    /// <inheritdoc />
    public partial class MarkNavigationParentOptionalV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Navigations_Navigations_ParentId",
                table: "Navigations");

            migrationBuilder.AlterColumn<int>(
                name: "ParentId",
                table: "Navigations",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddForeignKey(
                name: "FK_Navigations_Navigations_ParentId",
                table: "Navigations",
                column: "ParentId",
                principalTable: "Navigations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Navigations_Navigations_ParentId",
                table: "Navigations");

            migrationBuilder.AlterColumn<int>(
                name: "ParentId",
                table: "Navigations",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Navigations_Navigations_ParentId",
                table: "Navigations",
                column: "ParentId",
                principalTable: "Navigations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
