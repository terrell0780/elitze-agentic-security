export default function BrandMarquee() {
  return (
    <div className="elitze-marquee" aria-label="ELITZE Agentic Security — identity, reachability, policy, evidence">
    <div className="elitze-marquee-track" aria-hidden="true">
    {Array.from({ length: 2 }, (_, index) => (
    <div key={index} className="flex">
    {["ELITZE AGENTIC SECURITY", "IDENTITY FIRST", "POLICY BEFORE EXECUTION", "EVIDENCE THAT HOLDS"].map((item) => (
    <span key={item} className="elitze-marquee-item">{item}<span>●</span></span>
    ))}
    </div>
    ))}
    </div>
    </div>
  );
}
