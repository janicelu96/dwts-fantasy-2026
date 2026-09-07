import { useEffect } from 'react'

export default function MyApp({ Component, pageProps }) {  
  useEffect(() => {  
    document.body.style.margin = '0'  
    document.body.style.backgroundColor = '#0d0d1a'  
    document.body.style.color = '#ffffff'  
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"  
  }, [])

  return <Component {...pageProps} />  
}  
