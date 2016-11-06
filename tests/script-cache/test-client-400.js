print('BEFORE HTTP 400 BAD REQUEST...');
Script.include('https://httpbin.org/status/400?' + new Date().getTime().toString(36))
print('//AFTER HTTP 400 BAD REQUEST.');
