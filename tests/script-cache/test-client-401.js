print('BEFORE HTTP 401 UNAUTHORIZED...');
Script.include('https://httpbin.org/basic-auth/user/passwd?' + new Date().getTime().toString(36));
print('//AFTER HTTP 401 UNAUTHORIZED.');
