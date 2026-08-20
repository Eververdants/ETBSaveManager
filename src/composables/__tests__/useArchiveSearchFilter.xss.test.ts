/**
 * Bug Condition Exploration Test for XSS Vulnerability
 *
 * This test demonstrates the XSS vulnerability in the highlightMatch() function.
 * The vulnerability exists because user-provided search queries containing HTML
 * special characters are not escaped before being wrapped in <mark> tags.
 *
 * **CRITICAL**: This test encodes the EXPECTED (fixed) behavior.
 * - On UNFIXED code: Test FAILS (proves the XSS vulnerability exists)
 * - After FIX: Test PASSES (confirms the vulnerability is fixed)
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import { describe, it, expect } from "vitest";
import { highlightMatch } from "../useArchiveSearchFilter";

describe("XSS Vulnerability - Bug Condition Exploration", () => {
  describe("Script Tag Injection", () => {
    it("should escape HTML entities in script tag to prevent XSS", () => {
      const query = "<script>alert('XSS')</script>";
      const text = `test ${query} test`;

      const result = highlightMatch(text, query);

      // EXPECTED BEHAVIOR: < and > should be escaped to prevent script execution
      // The script tag should appear as literal text: &lt;script&gt;
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("&lt;/script&gt;");
      // Should NOT contain unescaped script tags
      expect(result).not.toMatch(/<script[^>]*>/i);
      expect(result).not.toContain("</script>");
    });
  });

  describe("Image onerror Injection", () => {
    it("should escape HTML entities in img tag to prevent XSS", () => {
      const query = "<img src=x onerror=alert(1)>";
      const text = `archive ${query}`;

      const result = highlightMatch(text, query);

      // EXPECTED BEHAVIOR: The img tag should be escaped
      expect(result).toContain("&lt;img");
      expect(result).toContain("&gt;");
      // Should NOT contain unescaped img tag
      expect(result).not.toMatch(/<img[^>]*>/i);
    });
  });

  describe("Event Handler Injection", () => {
    it("should escape HTML entities in div with onload to prevent XSS", () => {
      const query = "<div onload=alert(1)>test</div>";
      const text = query;

      const result = highlightMatch(text, query);

      // EXPECTED BEHAVIOR: The div tag should be escaped
      expect(result).toContain("&lt;div");
      expect(result).toContain("&lt;/div&gt;");
      // Should NOT contain unescaped div tags
      expect(result).not.toMatch(/<div[^>]*>/i);
      expect(result).not.toContain("</div>");
    });
  });

  describe("All Special Characters", () => {
    it("should escape all HTML special characters to entities", () => {
      const query = "<>&\"'";
      const text = `test${query}test`;

      const result = highlightMatch(text, query);

      // EXPECTED BEHAVIOR: All five HTML special characters should be escaped
      expect(result).toContain("&lt;"); // <
      expect(result).toContain("&gt;"); // >
      expect(result).toContain("&amp;"); // &
      expect(result).toContain("&quot;"); // "
      expect(result).toContain("&#39;"); // '

      // Should NOT contain unescaped special characters (except in entity form)
      // Check that raw < > & " ' don't appear outside of entities
      // We need to be careful - the text might have & from &lt; etc.
      // So we check the query portion doesn't have raw characters
      const matchPortion = result.match(/test([^t]*)test/);
      if (matchPortion) {
        const highlighted = matchPortion[1];
        // After escaping, the query portion should only contain entities
        expect(highlighted).not.toMatch(/<(?!\/?mark)/); // < not followed by mark tag
        expect(highlighted).not.toMatch(/>(?!\/?mark)/); // > not part of mark tag
      }
    });
  });

  describe("Mixed Content Injection", () => {
    it("should escape script tag within legitimate text", () => {
      const query = "test<script>alert(1)</script>more";
      const text = query;

      const result = highlightMatch(text, query);

      // EXPECTED BEHAVIOR: Script tag should be escaped
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("&lt;/script&gt;");
      expect(result).not.toMatch(/<script[^>]*>/i);
    });

    it("should escape multiple HTML tags", () => {
      const query = "<b>bold</b><i>italic</i>";
      const text = query;

      const result = highlightMatch(text, query);

      // EXPECTED BEHAVIOR: Both tags should be escaped
      expect(result).toContain("&lt;b&gt;");
      expect(result).toContain("&lt;i&gt;");
      expect(result).not.toMatch(/<[bi][^>]*>/i);
    });
  });

  describe("Highlight Match Behavior", () => {
    it("should wrap matched content in <mark> tags", () => {
      const query = "test";
      const text = "this is a test string";

      const result = highlightMatch(text, query);

      // Normal behavior - highlighting works
      expect(result).toContain('<mark class="search-highlight">test</mark>');
    });

    it("should escape query with HTML when matched in text", () => {
      // This tests the actual XSS scenario - user types malicious query
      // and it should be escaped, not rendered as HTML
      const query = "<script>";
      const text = "some <script> code";

      const result = highlightMatch(text, query);

      // EXPECTED BEHAVIOR: The <script> should be escaped
      expect(result).toContain("&lt;script&gt;");
      expect(result).not.toMatch(/<script[^>]*>/i);
    });
  });
});
