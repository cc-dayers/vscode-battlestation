/** Type declaration for CSS files imported as strings via esbuild plugin */
declare module "*.css" {
  const content: string;
  export default content;
}
