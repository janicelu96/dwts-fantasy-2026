import { useState, useEffect } from 'react'

function MyApp({ Component, pageProps }) {  
  return (  
    <div>  
      <style jsx global>{`  
        * {  
          margin: 0;  
          padding: 0;  
          box-sizing: border-box;  
        }  
        body {  
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;  
          background: linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #2d1b69 100%);  
          min-height: 100vh;  
          color: #ffffff;  
        }  
        a {  
          color: inherit;  
          text-decoration: none;  
        }  
      `}</style>  
      <Component {...pageProps} />  
    </div>  
  )  
}

export default MyApp  
