using System.Text.Json;
using RoiExtractor.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower;
        o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpClient<IAnthropicService, AnthropicService>();

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p => p
        .WithOrigins(
            "http://localhost:5173",  // Vite dev server
            "http://localhost:3000"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapControllers();
app.Run();
