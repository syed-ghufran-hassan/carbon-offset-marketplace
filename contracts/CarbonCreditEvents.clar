;; Event emissions for important actions in the carbon offset marketplace

;; Mint a new carbon credit NFT
;; recipient: the principal (user) who will receive the token
;; amount: the number of carbon credits to mint
(define-public (mint (recipient principal) (amount uint))
  (begin
    ;; Print an event to signal that new tokens were minted
    ;; This can be captured off-chain to track minting activity
    (print {event: "mint", to: recipient, amount: amount})
    ;; Return success
    (ok true)
  )
)

;; Retire a carbon credit NFT
;; token-id: ID of the token being retired
;; by: principal who is retiring the token
;; purpose: description of why the token is retired
(define-public (retire (token-id uint) (by principal) (purpose (string-utf8 100)))
  (begin
    ;; Print an event to signal that a token was retired
    ;; Retired tokens cannot be reused or sold
    (print {event: "retire", token-id: token-id, by: by, purpose: purpose})
    ;; Return success
    (ok true)
  )
)

;; List a token for sale in the marketplace
;; token-id: ID of the token being listed
;; price: sale price for the token
;; seller: principal listing the token
(define-public (list-token (token-id uint) (price uint) (seller principal))
  (begin
    ;; Print an event to signal that a token has been listed
    ;; Off-chain systems can pick this up to show available listings
    (print {
      event: "list",
      token-id: token-id,
      price: price,
      seller: seller
    })
    ;; Return success
    (ok true)
  )
)

;; Purchase a token from another user
;; token-id: ID of the token being purchased
;; from: principal selling the token
;; to: principal buying the token
;; price: agreed purchase price
(define-public (purchase (token-id uint) (from principal) (to principal) (price uint))
  (begin
    ;; Print an event to signal that a purchase has occurred
    ;; Useful for tracking ownership transfers and transactions
    (print {
      event: "purchase",
      token-id: token-id,
      from: from,
      to: to,
      price: price
    })
    ;; Return success
    (ok true)
  )
)