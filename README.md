jQuery plugin for Hashcash.io
=============================

This is very early development release. Things might break. Make sure to signup for mailing
list at https://hashcash.io/ to stay up to date on latest developments of this project.

### How to use:

* Obtain new keys set at https://hashcash.io/
* Include *jquery.hashcash.io.min.js* and *jquery.hashcash.io.min.css* on your page.
* To add lock to submit button of your form:

```javascript
$(function() {
  $("form input[type=submit]").hashcash({'
    key: "YOUR-PUBLIC-KEY"
  });
});
```

* To verify work on the server side:

```php
<?php

if (! $_REQUEST['hashcashid']) {
  die("Please unlock submit button.");
}

$url = 'https://hashcash.io/api/checkwork/' . $_REQUEST['hashcashid'] . '?apikey=[YOUR-PRIVATE-KEY]';
$work = json_decode(file_get_contents($url));

if (! $work) {
  die("Please try again");
}

if ($work->totalDone < 0.01) {
  die("You did not wait long enough");
}

saveAndPublishPost();

?>
```

### Options

$.fn.hashcash([options]) where *options* can be:

    {
        autoId: true,
        id: guid(),
        complexity: 0.01,
        key: null,
        beforeCb: null,
        progressCb: null,
        doneCb: null,
        targetEl: null,
        hashcashInputName: 'hashcashid'
    }

*autoId* - generate id automatically. Set to false if you are going to manipulate id yourself.

*id* is randomly generated, or you can supply your own id.

*complexity* sets how hard browser need to work in order to unlock form. Larger complexity -
longer it takes to unlock it.

*key* - your PUBLIC key

*beforeCb* - function assigned to this option will be called before lock widget is added
to the form.

*doneCb* - function assigned to this option will be called when calculation will be finished.

*targetEl* - used to specify custom element to add widget to. By default widget added
right before button it is attached to.

*hashcashInputName* - used to override default "hashcashid" hidden input element to pass
work id for server-side verification.
