import {useEffect,useState,type ReactNode} from 'react';
import {Moon,Sun,Grid2X2,ChevronDown,LogOut,Box} from 'lucide-react';
import {Button} from './components/ui/button';
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger} from './components/ui/dropdown-menu';
export type Service={name:string;url:string;icon?:string;colour?:string};
function warm(url:string){const u=new URL(url,location.href);if(!['http:','https:'].includes(u.protocol))return;if(document.querySelector(`link[data-warm="${CSS.escape(u.origin)}"]`))return;const l=document.createElement('link');l.rel='prefetch';l.href=u.href;l.dataset.warm=u.origin;document.head.append(l);const c=document.createElement('link');c.rel='preconnect';c.href=u.origin;document.head.append(c)}
export function AppShell({name,email,services,children}:{name:string;email?:string;services:Service[];children:ReactNode}){
 const [dark,setDark]=useState(()=>{const saved=localStorage.getItem('shell-theme');return saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches});
 useEffect(()=>{document.documentElement.classList.toggle('dark',dark)},[dark]);
 useEffect(()=>{const m=matchMedia('(prefers-color-scheme: dark)');const h=()=>{if(!localStorage.getItem('shell-theme'))setDark(m.matches)};m.addEventListener('change',h);return()=>m.removeEventListener('change',h)},[]);
 return <><header className="shell-header"><div className="shell-title"><Box size={21}/><span>{name}</span><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" aria-label="Switch app"><Grid2X2/><ChevronDown/></Button></DropdownMenuTrigger><DropdownMenuContent align="start">{services.map(s=><DropdownMenuItem key={s.url} asChild><a href={s.url} onMouseEnter={()=>warm(s.url)} onFocus={()=>warm(s.url)}><span aria-hidden>{s.icon||'◻'}</span>{s.name}</a></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div><div className="shell-right"><span className="shell-email">{email||'Signing in…'}</span><Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={()=>{localStorage.setItem('shell-theme',dark?'light':'dark');setDark(!dark)}}>{dark?<Sun/>:<Moon/>}</Button><Button variant="ghost" size="icon" asChild><a href="/cdn-cgi/access/logout" aria-label="Sign out"><LogOut/></a></Button></div></header><main className="shell-main">{children}</main></>;
}
