<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store custom requests and private attachments through the browser Cloud client with bounded anonymous INSERT and admin-only SELECT/UPDATE policies, so anonymous submission never exposes customer lists.
- Normalize opinion delivery types only at reporting/export boundaries, retaining raw historical answers and keeping existing KPIs unchanged.
- Reuse HowItWorks in home and the first-visit welcome; only the welcome-seen flag belongs in browser storage.
