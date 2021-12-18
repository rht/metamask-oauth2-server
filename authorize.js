(function(){
  function authorize(e) {
    if (window.ethereum) {
      function doRespJson(resp, cb) {
        if (!resp.ok) {
          resp.text().then(parsed => alert(parsed))
          return
        }
        resp.json().then(cb)
      }
      function doIt() {
        // Redirect to /authorize endpoint
        let params = new URLSearchParams(window.location.search)
        params.append('address', window.ethereum.selectedAddress)
        let u = new URLSearchParams(params).toString()
        fetch('http://localhost:8080/challenge?' + u, { method: 'POST' })
          .then((resp) => {
            doRespJson(resp, parsed => {
              window.ethereum
              .request({
                method: 'personal_sign',
                params: [parsed.nonce, window.ethereum.selectedAddress],
              })
              .then((signature) => {
                fetch('http://localhost:8080/auth_code', {
                  method: 'POST',
                  mode: 'cors',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({state: params.get('state'), signature: signature, redirect_uri: params.get('redirect_uri')})
                })
                .then(resp => {
                  doRespJson(resp, parsed => {
                    const u = new URLSearchParams(parsed).toString()
                    window.location.href = params.get('redirect_uri') + '?' + u
                  })
                })
              })
            })
          })
      }
      if (window.ethereum.isConnected() && window.ethereum.selectedAddress) {
        doIt()
      } else {
        window.ethereum.request({ method: 'eth_requestAccounts' })
      }
    } else {
      alert('Please install metamask')
      console.log('Please install metamask')
    }
  }

  document.getElementById("authorize").addEventListener("click", authorize)
})()
