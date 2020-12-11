declare module '*.css';
declare module '*.less';
declare module '*.png';
declare module '*.svg' {
  import ReactComponent from 'react'
  export function ReactComponent(props: React.SVGProps<SVGSVGElement>): React.ReactElement;
  const url: string;
  export default url;
}
