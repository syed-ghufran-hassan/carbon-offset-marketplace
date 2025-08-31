(define-public (retire-carbon-credit (token-id uint))
  (let (
        ;; Call get-owner and unwrap the result
        (owner-opt (unwrap! (contract-call? .CarbonCredits get-owner token-id) (err u400)))
        (owner (unwrap! owner-opt (err u401)))

        ;; Get metadata and unwrap
        (metadata (unwrap! (contract-call? .CarbonCredits get-token-metadata token-id) (err u402)))
       )
    (begin
      ;; Check if sender is owner
      (asserts! (is-eq owner tx-sender) (err u403))

      ;; Ensure not already retired
      (asserts! (not (get retired metadata)) (err u404))

      ;; Update metadata to mark as retired
      (unwrap! (contract-call? .CarbonCredits update-metadata token-id 
        (merge 
          metadata
          {retired: true})) (err u405))

      ;; Remove from sale if listed
      
      (unwrap! (contract-call? .CarbonListing delist-token token-id) (err u500))

      (ok token-id))))
