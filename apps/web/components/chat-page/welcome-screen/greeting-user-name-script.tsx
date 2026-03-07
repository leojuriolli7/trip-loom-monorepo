/**
 * This is a trick best explained in:
 * https://ethanniser.dev/blog/a-clock-that-doesnt-snap/
 *
 * Basically, on the server layout we have an element that stores our user's name:
 *
 * ```
 *  <div id="chat-layout-user-name" data-user-name={session.user.name} />
 * ```
 *
 * And the script updates the username on screen before hydration, so no layout shift
 * or hydration mismatch happens.
 */
export function GreetingUserNameScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(() => {
          const source = document.getElementById("chat-layout-user-name");
          const target = document.getElementById("greeting-user-name");
          if (!source || !target) return;
          const name = source.getAttribute("data-user-name") || "";
          target.textContent = name ? ", " + name : "";
        })();`,
      }}
    />
  );
}
