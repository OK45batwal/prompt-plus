#!/bin/bash
DB="./dev.db"
NOW=$(date -u +"%Y-%m-%d %H:%M:%S")

sqlite3 "$DB" <<SQL
INSERT INTO users (id, email, name, provider, created_at, updated_at) VALUES ('cm0000000000000000000001', 'demo@example.com', 'Demo User', 'email', '$NOW', '$NOW');

INSERT INTO collections (id, user_id, name, description, color, icon, created_at, updated_at) VALUES
('cm1000000000000000000001', 'cm0000000000000000000001', 'Work', 'Work-related prompts', '#000', 'folder', '$NOW', '$NOW'),
('cm1000000000000000000002', 'cm0000000000000000000001', 'Personal', 'Personal projects', '#000', 'folder', '$NOW', '$NOW');

INSERT INTO prompts (id, user_id, title, original_text, model, score, category, is_saved, created_at, updated_at) VALUES
('cm2000000000000000000001', 'cm0000000000000000000001', 'Blog Post Introduction', 'Write a blog intro about AI', 'gpt-4', '85', 'blog_post', 1, '$NOW', '$NOW'),
('cm2000000000000000000002', 'cm0000000000000000000001', 'Email Follow-up Template', 'Write a follow-up email', 'claude-3', '78', 'email', 1, '$NOW', '$NOW'),
('cm2000000000000000000003', 'cm0000000000000000000001', 'Code Review Request', 'Review this pull request', 'gpt-4', '92', 'code_review', 1, '$NOW', '$NOW');

INSERT INTO templates (id, title, description, category, prompt, variables, created_at, updated_at) VALUES
('cm3000000000000000000001', 'Blog Post', 'SEO-optimized blog post', 'blog_post', 'Write a blog post about {{topic}}', '[{"name":"topic","type":"text","label":"Topic","required":true}]', '$NOW', '$NOW'),
('cm3000000000000000000002', 'Email', 'Professional email', 'email', 'Write an email about {{subject}}', '[{"name":"subject","type":"text","label":"Subject","required":true}]', '$NOW', '$NOW'),
('cm3000000000000000000003', 'Code Review', 'Review code changes', 'code_review', 'Review this code: {{code}}', '[{"name":"code","type":"textarea","label":"Code","required":true}]', '$NOW', '$NOW');
SQL

echo "Seeded successfully."
