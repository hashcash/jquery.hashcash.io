jQuery plugin for Hashcash.io
=============================

This is very early development release. Things might break. Make sure to signup for mailing
list at https://hashcash.io/ to stay up to date on latest developments of this project.

### How to use:

* Obtain new keys set at https://hashcash.io/
* Include *jquery.hashcash.io.min.js* and *jquery.hashcash.io.min.css* on your page.
* To add hashcash protection to your form:

```javascript
$(function() {
  $("form input[type=submit]").hashcash({
    key: "YOUR-PUBLIC-KEY",
    complexity: 0.01
  });
});
```

* To verify work on the server side:

```php
<?php

if (! $_REQUEST['hashcashid']) {
  die("Please enable Javascript in your browser.");
}

$url = 'https://hashcash.io/api/usework/' . $_REQUEST['hashcashid'] . '/0.01?apikey=[YOUR-PRIVATE-KEY]';
$result = json_decode(file_get_contents($url));

if (! $result) {
  die("Please try again");
}

if ($result->status != 'success') {
  die("You did not wait long enough");
}

saveAndPublishPost();

?>
```

### Options

$.fn.hashcash([options]) where *options* can be:

    {
        complexity: 0.01,
        key: null,
        beforeCb: null,
        progressCb: null,
        doneCb: null,
        formEl: null,
        hashcashInputElName: 'hashcashid',
        lang: {
            progressTimeLeft    : 'Please wait __timeLeft__ more seconds before submitting form.',
            progress            : 'Please wait before submitting form.',
            notSupportedBrowser : 'Your browser is not supported. Please use latest version of Chrome, Firefox or Internet Explorer.',
            runtimeError        : 'Runtime error. Please try to refresh page.',
            formReady           : 'You can submit form now.'
        },
        templates: {
            widget:
                '<a href="#" class="hashcash-widget">' +
                  '<span class="hashcash-widget-progress">' +
                    '<span class="hashcash-widget-progress-bar"></span>' +
                  '</span>' +
                '</a>',
            message:
                '<span class="hashcash-message-box">' +
                '</span>'
        }
    }

*complexity* sets how hard browser need to work in order to unlock form. Larger complexity -
longer it takes to unlock it.

*key* - your PUBLIC key

*beforeCb* - function assigned to this option will be called before lock widget is added
to the form.

*doneCb* - function assigned to this option will be called when calculation will be finished.

*targetEl* - used to specify custom element to add widget to. By default widget added
right before button it is attached to. Can be either jquery selector string or jquery element.

*formEl* - used to specify form to attach onSubmit events and hidden hashcashid field. By default
looks for parent of submit button widget is attached to. Can be jquery selector string or jquery element.

*hashcashInputElName* - used to override default "hashcashid" hidden input element to pass
work id for server-side verification.

*lang* - used to override default strings for example for translation.

*templates* - in case you need to tweak templates used for widget - you can change it here.

### Available integrations

* https://drupal.org/project/pow_captcha
* http://wordpress.org/plugins/hashcash/

