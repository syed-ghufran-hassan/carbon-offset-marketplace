;; Event emissions for important actions

(define-public (mint (recipient principal) (amount uint))
  (begin
    (print {event: "mint", to: recipient, amount: amount})
    (ok true)
  )
)

(define-public (retire (token-id uint) (by principal) (purpose (string-utf8 100)))
  (begin
    (print {event: "retire", token-id: token-id, by: by, purpose: purpose})
    (ok true)
  )
)

(define-public (list-token (token-id uint) (price uint) (seller principal))
  (begin
    (print {
      event: "list",
      token-id: token-id,
      price: price,
      seller: seller
    })
    (ok true)
  )
)


 (define-public (purchase (token-id uint) (from principal) (to principal) (price uint))
  (begin
    (print {
      event: "purchase",
      token-id: token-id,
      from: from,
      to: to,
      price: price
    })
    (ok true)
  )
)

