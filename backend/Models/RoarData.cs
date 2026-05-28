namespace RoiExtractor.Api.Models;

public class RoarData
{
    public string Client                        { get; set; } = "";
    public string Publisher                     { get; set; } = "";
    public string DateDelivered                 { get; set; } = "";
    public string Year                          { get; set; } = "";
    public string Currency                      { get; set; } = "USD";
    public decimal IdentifiedRisk               { get; set; }
    public decimal IdentifiedCostAvoidance      { get; set; }
    public decimal AccomplishedCostAvoidance    { get; set; }
    public decimal IdentifiedCostOptimization   { get; set; }
    public decimal AccomplishedCostOptimization { get; set; }
    public decimal RealizedCostSavings          { get; set; }
    public decimal AnnualPublisherContractSpend { get; set; }
    public string PricingAvailable              { get; set; } = "";
    public string Notes                         { get; set; } = "";
    public string ElevateDeliverable            { get; set; } = "";
    public List<BreakdownItem> Breakdown        { get; set; } = [];
}

public class BreakdownItem
{
    public string  Product      { get; set; } = "";
    public string  Category     { get; set; } = "";
    public decimal Identified   { get; set; }
    public decimal Accomplished { get; set; }
    public string  Description  { get; set; } = "";
}
