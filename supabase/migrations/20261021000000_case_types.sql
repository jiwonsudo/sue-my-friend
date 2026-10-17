-- 사건 유형 세분화: 대분류 5개 아래 세부 유형 16개 (src/lib/constants.ts CASE_TYPES)
alter table cases drop constraint if exists cases_type_check;
alter table cases add constraint cases_type_check check (
  type in (
    'bet', 'noshow', 'late', 'flipflop',
    'borrowed', 'item', 'dutch', 'food',
    'ghosting', 'unread', 'groupchat', 'birthday', 'photo',
    'game', 'spoiler',
    'custom'
  )
);
