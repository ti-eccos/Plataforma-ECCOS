// src/client-env.d.ts
declare module '*.html' {
    const content: string
    export default content
  }
  
  declare module '*.node' {
    const value: any
    export default value
  }