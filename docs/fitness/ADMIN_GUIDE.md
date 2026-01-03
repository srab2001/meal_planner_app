# Admin Guide — Fitness Interview

Use the Admin panel at `/admin/fitness-interview` to:

- View question list: reorder, edit, enable/disable
- Edit question details (label, help_text, input_type, required, enabled)
- Manage options for single/multi-select questions (add/edit/reorder/enable)

Important enforced rules:
- `main_goal` must be single_select
- `primary_objectives` must be multi_select
- `fitness_level` must be single_select
- `training_style` must be single_select

When changing questions, ensure the client interview UI can still map answers by `key` or `id`.
