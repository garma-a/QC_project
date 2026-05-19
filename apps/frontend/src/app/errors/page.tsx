import { redirect } from 'next/navigation';

export default function ErrorsRedirectPage() {
  redirect('/alerts');
}
