import { siteConfig } from "@/config/site";

export function buildEmailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: #2563eb; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${siteConfig.name}</h1>
        </div>
        <div style="padding: 24px;">
          ${content}
        </div>
        <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function buildDailyDigestEmail(articles: { title: string; slug: string; excerpt: string; type: string }[]): string {
  const articlesList = articles
    .map(
      (a) => `
      <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
        <span style="background: #dbeafe; color: #2563eb; font-size: 11px; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">${a.type}</span>
        <h3 style="margin: 8px 0 4px;">
          <a href="${siteConfig.url}/blog/${a.slug}" style="color: #111827; text-decoration: none;">${a.title}</a>
        </h3>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">${a.excerpt}</p>
      </div>
    `
    )
    .join("");

  return buildEmailWrapper(`
    <h2 style="color: #111827;">Today's Baseball Update</h2>
    <p style="color: #6b7280;">Here are the latest articles from ${siteConfig.name}:</p>
    ${articlesList}
    <div style="text-align: center; margin-top: 24px;">
      <a href="${siteConfig.url}/blog" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        Read More on ${siteConfig.name}
      </a>
    </div>
  `);
}
