print('BEFORE HTTP 404 Not Found...');
Script.include('https://httpbin.org/status/404?' + new Date().getTime().toString(36))
print('//AFTER HTTP 404 Not Found.');
