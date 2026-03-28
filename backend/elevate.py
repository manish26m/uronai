from database import db
res = db.users.update_one({'email': 'uronaioffical@gmail.com'}, {'$set': {'role': 'admin'}})
print(f'Matched {res.matched_count}, Modified {res.modified_count}')
