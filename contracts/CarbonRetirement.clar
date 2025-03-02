(define-public (retire-carbon-credit (token-id uint))
  (let ((owner (contract-call? .CarbonCredits get-token-owner token-id))
        (metadata (contract-call? .CarbonCredits get-token-metadata token-id)))
    (begin
      (asserts! (is-eq owner tx-sender) (err u400))
      (asserts! (not (unwrap! metadata (err u401)).retired) (err u402))

      ;; Mark token as retired
      (asserts! (contract-call? .CarbonCredits update-metadata token-id 
        (merge 
          (unwrap! metadata (err u403))
          {retired: true})) (err u404))

      ;; Remove from sale if listed
      (map-delete .CarbonListing listings token-id)

      (ok token-id)))))
