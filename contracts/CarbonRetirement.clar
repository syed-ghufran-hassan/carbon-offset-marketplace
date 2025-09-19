;; ==========================
;; Retire a carbon credit NFT
;; ==========================
;; token-id: the carbon credit token to retire
(define-public (retire-carbon-credit (token-id uint))
  (let ((owner    (contract-call? .CarbonCredits get-token-owner token-id)) ;; Get current owner
        (metadata (contract-call? .CarbonCredits get-token-metadata token-id))) ;; Get token metadata
    (begin
      ;; Ensure the caller is the owner of the token
      (asserts! (is-eq owner tx-sender) (err u400)) ;; u400 = caller not owner

      ;; Ensure the token has not already been retired
      (asserts! (not (unwrap! metadata (err u401)).retired) (err u402)) ;; u402 = token already retired

      ;; ==========================
      ;; Mark token as retired in the CarbonCredits contract
      ;; ==========================
      ;; Merge existing metadata with {retired: true}
      (asserts! (contract-call? .CarbonCredits update-metadata token-id 
        (merge 
          (unwrap! metadata (err u403)) ;; unwrap existing metadata
          {retired: true})) ;; update retired field
        (err u404)) ;; u404 = failed to update metadata

      ;; ==========================
      ;; Remove token from marketplace if it is listed for sale
      ;; ==========================
      (map-delete .CarbonListing listings token-id)

      ;; Return token ID as confirmation of retirement
      (ok token-id)
    )
  )
)
