You are a senior ASP.NET Core UI/UX engineer and frontend performance expert.

I am using the Blogifier GitHub repository (ASP.NET Core based CMS) and I have modified it for my company blog site.

I am facing two issues:

1) The mobile view is broken / not properly responsive.
   - Layout breaks in smaller screens
   - Some elements overflow
   - Navigation is not clean on mobile
   - Font sizes and spacing are inconsistent

2) I want to change the entire site theme background to this green-touch gradient:

background: linear-gradient(
135deg, #1a1a1a 0%, #0a2a0a 50%, #1a1a1a 100%
);

GOALS:

- Make the site fully responsive (mobile-first approach)
- Fix layout breaking issues
- Improve navbar behavior on mobile
- Ensure images scale properly
- Improve spacing and typography
- Apply the new gradient theme globally
- Maintain good contrast and readability
- Do NOT break desktop layout
- Follow clean ASP.NET Core + Razor best practices

IMPORTANT:

- Identify which files to modify (_Layout.cshtml, site.css, theme.css, etc.)
- Show exact code changes
- Show before and after CSS if needed
- Use proper media queries
- If Bootstrap is used, use correct grid classes
- Do not remove core functionality
- Keep changes production-safe

Deliverables:

1. File-by-file modification list
2. Exact CSS updates
3. Razor layout modifications (if needed)
4. Mobile responsive fixes with explanation
5. Testing checklist for mobile validation

Assume I am working in ASP.NET Core 6+.