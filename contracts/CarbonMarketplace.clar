 (define-non-fungible-token carbon-credit uint)

(define-map token-owners uint principal)
(define-map token-metadata uint
  {
    project: (string-utf8 50),
    location: (string-utf8 50),
    metric-ton: uint,
    retired: bool
  }
)

(define-data-var next-token-id uint u1)

(define-public (mint (to principal) (project (string-utf8 50)) (location (string-utf8 50)) (metric-ton uint))
  (let ((token-id (var-get next-token-id)))
    (begin
      (asserts! (<= (len project) u50) (err u200))
      (asserts! (<= (len location) u50) (err u201))
      (asserts! (> metric-ton u0) (err u202))

      (asserts! (map-insert token-owners token-id to) (err u100))
      (asserts! (map-insert token-metadata token-id {project: project, location: location, metric-ton: metric-ton, retired: false}) (err u101))
      (var-set next-token-id (+ token-id u1))
      (ok token-id)
    )
  )
)

(define-public (transfer (token-id uint) (recipient principal))
  (let ((owner (map-get? token-owners token-id)))
    (begin
      (asserts! (is-some owner) (err u102))
      (asserts! (is-eq (unwrap! owner (err u103)) tx-sender) (err u104))
      (asserts! (map-set token-owners token-id recipient) (err u105))
      (ok token-id)
    )
  )
)

(define-public (retire-carbon-credit (token-id uint))
  (let ((owner (map-get? token-owners token-id)))
    (begin
      (asserts! (is-some owner) (err u106))  ;; Token doesn't exist
      (asserts! (is-eq (unwrap! owner (err u107)) tx-sender) (err u108))  ;; Only the owner can retire
      (let ((metadata (unwrap! (map-get? token-metadata token-id) (err u109))))
        (asserts! (not (get retired metadata)) (err u110))  ;; Already retired
        (map-set token-metadata token-id (merge metadata {retired: true}))
        (ok token-id)
      )
    )
  )
)

(define-read-only (get-owner (token-id uint))
  (ok (map-get? token-owners token-id))
)

(define-read-only (get-token-metadata (token-id uint))
  (match (map-get? token-metadata token-id)
    metadata (ok metadata)
    (err u110)
  )
)
