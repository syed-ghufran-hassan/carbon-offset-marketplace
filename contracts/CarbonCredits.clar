;; Carbon Credit NFT contract without traits

;; Define a non-fungible token type called `carbon-credit` using uint as the token ID
(define-non-fungible-token carbon-credit uint)

;; Map to store ownership of each token
;; key: token-id (uint), value: owner principal
(define-map token-owners uint principal)

;; Map to store metadata about each carbon credit
;; key: token-id (uint)
;; value: a record containing project name, location, metric tons, and retirement status
(define-map token-metadata uint
  {
    project: (string-utf8 50),
    location: (string-utf8 50),
    metric-ton: uint,
    retired: bool
  }
)

;; Data variable to track the next available token ID
(define-data-var next-token-id uint u1)

;; ==========================
;; Mint a new carbon credit NFT
;; ==========================
;; to: recipient principal
;; project: name of the carbon offset project
;; location: location of the project
;; metric-ton: amount of CO₂ offset
(define-public (mint (to principal) (project (string-utf8 50)) (location (string-utf8 50)) (metric-ton uint))
  (let ((token-id (var-get next-token-id))) ;; assign current token ID
    (begin
      ;; Validation checks
      (asserts! (<= (len project) u50) (err u200))    ;; project name length <= 50
      (asserts! (<= (len location) u50) (err u201))   ;; location length <= 50
      (asserts! (> metric-ton u0) (err u202))         ;; metric-ton must be > 0

      ;; Store ownership
      (asserts! (map-insert token-owners token-id to) (err u100))

      ;; Store metadata with `retired` set to false
      (asserts! (map-insert token-metadata token-id {project: project, location: location, metric-ton: metric-ton, retired: false}) (err u101))

      ;; Increment token ID for next mint
      (var-set next-token-id (+ token-id u1))

      ;; Return minted token ID
      (ok token-id)
    )
  )
)

;; ==========================
;; Transfer ownership of a token
;; ==========================
;; Only the current owner can transfer the token to another principal
(define-public (transfer (token-id uint) (recipient principal))
  (let ((owner (map-get? token-owners token-id))) ;; get current owner
    (begin
      (asserts! (is-some owner) (err u102)) ;; token must exist
      ;; Ensure caller is the current owner
      (asserts! (is-eq (unwrap! owner (err u103)) tx-sender) (err u104))
      ;; Update token ownership
      (asserts! (map-set token-owners token-id recipient) (err u105))
      ;; Return token ID on success
      (ok token-id)
    )
  )
)

;; ==========================
;; Read-only function to get owner of a token
;; ==========================
(define-read-only (get-owner (token-id uint))
  ;; Returns the owner principal if token exists
  (ok (map-get? token-owners token-id))
)

;; ==========================
;; Read-only function to get metadata of a token
;; ==========================
(define-read-only (get-token-metadata (token-id uint))
  ;; Returns metadata if token exists, otherwise error
  (match (map-get? token-metadata token-id)
    metadata (ok metadata)
    (err u110)
  )
)
