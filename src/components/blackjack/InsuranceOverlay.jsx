import React from "react";

export default function InsuranceOverlay({
  showInsuranceOverlay,
  insuranceAmount,
  onTakeInsurance,
  onNoInsurance,
}) {
  if (!showInsuranceOverlay) return null;

  return (
    <div className="insurance-overlay">
      <div className="insurance-box">
        <div className="insurance-label">INSURANCE OFFER</div>

        <h2>Dealer shows an Ace</h2>

        <p>
          Take insurance for {insuranceAmount} credits?
          <br />
          Insurance pays 2:1 if the dealer has Blackjack.
        </p>

        <div className="insurance-actions">
          <button className="insurance-yes" onClick={onTakeInsurance}>
            Take Insurance
          </button>

          <button className="insurance-no" onClick={onNoInsurance}>
            No Insurance
          </button>
        </div>
      </div>
    </div>
  );
}
